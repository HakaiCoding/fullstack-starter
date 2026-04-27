<#
.SYNOPSIS
Exports canonical AI workflow documentation into a zip archive.

.DESCRIPTION
Starts from workflow seed markdown files and recursively includes local markdown files
reached by markdown links. Preserves repository-relative paths so links continue to work
after extraction. Excludes temporary methodology/playbook markdown files by design.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$OutputPath = 'ai-workflow-docs.zip'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = if ($PSScriptRoot) {
  [System.IO.Path]::GetFullPath($PSScriptRoot)
} else {
  [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
}
$repoRootWithSeparator = $repoRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

$expectedSeedFiles = @(
  'README.md',
  'AI_CONTRACT.md',
  'ARCHITECTURE.md',
  'DECISIONS.md',
  'projectmap.md',
  'specs/_template.md',
  'docs/README.md',
  'docs/commands-reference.md'
)

$temporaryMarkdownExcludePattern = '(?i)(^|/)(constrained_ai_assisted_development_playbook|.*playbook.*|.*methodology.*)\.md$'

function Normalize-RelativePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  return ($Path -replace '\\', '/').Trim()
}

function Test-IsPathWithinRepository {
  param(
    [Parameter(Mandatory = $true)]
    [string]$AbsolutePath
  )

  $fullPath = [System.IO.Path]::GetFullPath($AbsolutePath)
  if ($fullPath.Equals($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  return $fullPath.StartsWith($repoRootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)
}

function Convert-ToRepoRelativePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$AbsolutePath
  )

  $fullPath = [System.IO.Path]::GetFullPath($AbsolutePath)
  $relativePath = $fullPath.Substring($repoRoot.Length).TrimStart('\', '/')
  return (Normalize-RelativePath -Path $relativePath)
}

function Test-IsTemporarilyExcludedMarkdown {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $normalizedPath = Normalize-RelativePath -Path $RelativePath
  return [System.Text.RegularExpressions.Regex]::IsMatch($normalizedPath, $temporaryMarkdownExcludePattern)
}

function Get-MarkdownLinkTargets {
  param(
    [Parameter(Mandatory = $true)]
    [string]$MarkdownContent
  )

  $targets = New-Object System.Collections.ArrayList
  $pattern = '(?<!\!)\[[^\]]*\]\((?<target>[^)\r\n]+)\)'

  foreach ($match in [System.Text.RegularExpressions.Regex]::Matches($MarkdownContent, $pattern)) {
    $rawTarget = $match.Groups['target'].Value
    if (-not [string]::IsNullOrWhiteSpace($rawTarget)) {
      [void]$targets.Add($rawTarget.Trim())
    }
  }

  return @($targets)
}

function Resolve-LocalMarkdownLink {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourceFileRelativePath,
    [Parameter(Mandatory = $true)]
    [string]$RawLinkTarget
  )

  $target = $RawLinkTarget.Trim()
  if ([string]::IsNullOrWhiteSpace($target)) {
    return [pscustomobject]@{ Status = 'skip' }
  }

  if ($target.StartsWith('<') -and $target.EndsWith('>') -and $target.Length -gt 2) {
    $target = $target.Substring(1, $target.Length - 2).Trim()
  }

  if ($target.StartsWith("'") -and $target.EndsWith("'") -and $target.Length -gt 2) {
    $target = $target.Substring(1, $target.Length - 2).Trim()
  }
  if ($target.StartsWith('"') -and $target.EndsWith('"') -and $target.Length -gt 2) {
    $target = $target.Substring(1, $target.Length - 2).Trim()
  }

  if ($target.StartsWith('#')) {
    return [pscustomobject]@{ Status = 'skip' }
  }

  if ($target -match '^(?i)https?://' -or $target -match '^(?i)mailto:') {
    return [pscustomobject]@{ Status = 'skip' }
  }

  if ($target -match '\s') {
    $target = ($target -split '\s+', 2)[0]
  }

  if ($target.Contains('#')) {
    $target = $target.Split('#')[0]
  }
  if ($target.Contains('?')) {
    $target = $target.Split('?')[0]
  }

  if ([string]::IsNullOrWhiteSpace($target)) {
    return [pscustomobject]@{ Status = 'skip' }
  }

  $normalizedTarget = Normalize-RelativePath -Path $target
  if (-not $normalizedTarget.ToLowerInvariant().EndsWith('.md')) {
    return [pscustomobject]@{ Status = 'skip' }
  }

  $sourceAbsolutePath = Join-Path $repoRoot ($SourceFileRelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  $sourceDirectory = Split-Path -Parent $sourceAbsolutePath

  $absoluteTargetPath = if ([System.IO.Path]::IsPathRooted($normalizedTarget)) {
    [System.IO.Path]::GetFullPath($normalizedTarget)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $sourceDirectory ($normalizedTarget -replace '/', [System.IO.Path]::DirectorySeparatorChar)))
  }

  if (-not (Test-IsPathWithinRepository -AbsolutePath $absoluteTargetPath)) {
    return [pscustomobject]@{
      Status = 'outside-repo'
      SourceFile = $SourceFileRelativePath
      RawTarget = $RawLinkTarget
    }
  }

  $relativeTargetPath = Convert-ToRepoRelativePath -AbsolutePath $absoluteTargetPath
  if (Test-IsTemporarilyExcludedMarkdown -RelativePath $relativeTargetPath) {
    return [pscustomobject]@{
      Status = 'excluded'
      RelativePath = $relativeTargetPath
      SourceFile = $SourceFileRelativePath
    }
  }

  if (-not (Test-Path -LiteralPath $absoluteTargetPath -PathType Leaf)) {
    return [pscustomobject]@{
      Status = 'missing'
      RelativePath = $relativeTargetPath
      SourceFile = $SourceFileRelativePath
    }
  }

  return [pscustomobject]@{
    Status = 'ok'
    RelativePath = $relativeTargetPath
  }
}

# Collect seed files.
$seedFilesFound = New-Object System.Collections.ArrayList
$missingExpectedSeeds = New-Object System.Collections.ArrayList

foreach ($seedPath in $expectedSeedFiles) {
  $normalizedSeedPath = Normalize-RelativePath -Path $seedPath
  $absoluteSeedPath = Join-Path $repoRoot ($normalizedSeedPath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  if (Test-Path -LiteralPath $absoluteSeedPath -PathType Leaf) {
    [void]$seedFilesFound.Add($normalizedSeedPath)
  } else {
    [void]$missingExpectedSeeds.Add($normalizedSeedPath)
    Write-Warning ("Expected seed workflow file is missing: {0}" -f $normalizedSeedPath)
  }
}

$specsDirectory = Join-Path $repoRoot 'specs'
if (Test-Path -LiteralPath $specsDirectory -PathType Container) {
  foreach ($specFile in Get-ChildItem -LiteralPath $specsDirectory -File -Filter '*.md') {
    [void]$seedFilesFound.Add((Normalize-RelativePath -Path ("specs/{0}" -f $specFile.Name)))
  }
} else {
  Write-Warning 'Expected seed directory is missing: specs/'
}

$seedFiles = @($seedFilesFound | Sort-Object -Unique)
if ($seedFiles.Count -eq 0) {
  throw 'No AI workflow seed markdown files were found.'
}

Write-Host 'Seed files found:'
foreach ($seedFile in $seedFiles) {
  Write-Host (" - {0}" -f $seedFile)
}

# Recursively discover linked local markdown files.
$seedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$includedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$visitedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$pendingQueue = New-Object 'System.Collections.Generic.Queue[string]'

$recursivelyDiscovered = New-Object System.Collections.ArrayList
$missingLinkedFiles = New-Object System.Collections.ArrayList
$intentionallyExcludedFiles = New-Object System.Collections.ArrayList
$outsideRepositoryLinks = New-Object System.Collections.ArrayList

foreach ($seedFile in $seedFiles) {
  [void]$seedSet.Add($seedFile)

  if (Test-IsTemporarilyExcludedMarkdown -RelativePath $seedFile) {
    [void]$intentionallyExcludedFiles.Add($seedFile)
    Write-Warning ("Intentionally excluding temporary/context markdown seed: {0}" -f $seedFile)
    continue
  }

  if ($includedSet.Add($seedFile)) {
    $pendingQueue.Enqueue($seedFile)
  }
}

while ($pendingQueue.Count -gt 0) {
  $currentFile = $pendingQueue.Dequeue()
  if (-not $visitedSet.Add($currentFile)) {
    continue
  }

  $currentAbsolutePath = Join-Path $repoRoot ($currentFile -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $currentAbsolutePath -PathType Leaf)) {
    continue
  }

  $content = Get-Content -Raw -LiteralPath $currentAbsolutePath
  foreach ($rawTarget in Get-MarkdownLinkTargets -MarkdownContent $content) {
    $resolution = Resolve-LocalMarkdownLink -SourceFileRelativePath $currentFile -RawLinkTarget $rawTarget

    if ($resolution.Status -eq 'ok') {
      if ($includedSet.Add($resolution.RelativePath)) {
        $pendingQueue.Enqueue($resolution.RelativePath)
        if (-not $seedSet.Contains($resolution.RelativePath)) {
          [void]$recursivelyDiscovered.Add($resolution.RelativePath)
        }
      }
      continue
    }

    if ($resolution.Status -eq 'missing') {
      if (-not ($missingLinkedFiles -contains $resolution.RelativePath)) {
        [void]$missingLinkedFiles.Add($resolution.RelativePath)
        Write-Warning ("Linked markdown file not found (from {0}): {1}" -f $resolution.SourceFile, $resolution.RelativePath)
      }
      continue
    }

    if ($resolution.Status -eq 'outside-repo') {
      $outsideRepoMessage = "{0} -> {1}" -f $resolution.SourceFile, $resolution.RawTarget
      if (-not ($outsideRepositoryLinks -contains $outsideRepoMessage)) {
        [void]$outsideRepositoryLinks.Add($outsideRepoMessage)
        Write-Warning ("Skipping markdown link outside repository root: {0}" -f $outsideRepoMessage)
      }
      continue
    }

    if ($resolution.Status -eq 'excluded') {
      if (-not ($intentionallyExcludedFiles -contains $resolution.RelativePath)) {
        [void]$intentionallyExcludedFiles.Add($resolution.RelativePath)
        Write-Warning ("Intentionally excluding temporary/context markdown file: {0}" -f $resolution.RelativePath)
      }
      continue
    }
  }
}

$includedFiles = @($includedSet | Sort-Object)
if ($includedFiles.Count -eq 0) {
  throw 'No markdown files were included after seed and recursive link processing.'
}

Write-Host 'Recursively discovered markdown files:'
if ($recursivelyDiscovered.Count -eq 0) {
  Write-Host ' - (none)'
} else {
  foreach ($discoveredFile in ($recursivelyDiscovered | Sort-Object -Unique)) {
    Write-Host (" - {0}" -f $discoveredFile)
  }
}

Write-Host 'Intentionally excluded files:'
if ($intentionallyExcludedFiles.Count -eq 0) {
  Write-Host ' - (none)'
} else {
  foreach ($excludedFile in ($intentionallyExcludedFiles | Sort-Object -Unique)) {
    Write-Host (" - {0}" -f $excludedFile)
  }
}

$resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath
} else {
  Join-Path $repoRoot $OutputPath
}
$resolvedOutputPath = [System.IO.Path]::GetFullPath($resolvedOutputPath)

$resolvedSourcePaths = @(
  $includedFiles | ForEach-Object {
    [System.IO.Path]::GetFullPath(
      (Join-Path $repoRoot ($_ -replace '/', [System.IO.Path]::DirectorySeparatorChar))
    )
  }
)

if ($resolvedSourcePaths -contains $resolvedOutputPath) {
  throw 'OutputPath resolves to a source workflow file. Choose a different zip destination.'
}

if (Test-Path -LiteralPath $resolvedOutputPath -PathType Container) {
  throw 'OutputPath points to a directory. Provide a file path (for example: ai-workflow-docs.zip).'
}

$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('ai-workflow-docs-' + [Guid]::NewGuid().ToString('N'))

try {
  New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

  foreach ($relativePath in $includedFiles) {
    $sourcePath = Join-Path $repoRoot ($relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
    $destinationPath = Join-Path $stagingRoot ($relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
    $destinationDirectory = Split-Path -Parent $destinationPath

    if (-not (Test-Path -LiteralPath $destinationDirectory -PathType Container)) {
      New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    }

    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
  }

  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }

  if (Test-Path -LiteralPath $resolvedOutputPath -PathType Leaf) {
    Remove-Item -LiteralPath $resolvedOutputPath -Force
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $stagingRoot,
    $resolvedOutputPath,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
  )

  Write-Host 'Final included file list:'
  foreach ($relativePath in $includedFiles) {
    Write-Host (" - {0}" -f $relativePath)
  }

  Write-Host ('Final zip path: {0}' -f $resolvedOutputPath)
}
finally {
  if ($stagingRoot -and (Test-Path -LiteralPath $stagingRoot -PathType Container)) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
}
