import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'auth_sessions' })
@Unique('UQ_auth_sessions_refresh_token_hash', ['refreshTokenHash'])
@Index('idx_auth_sessions_expires_at', ['expiresAt'])
@Index('idx_auth_sessions_revoked_at', ['revokedAt'])
@Check(
  'CHK_auth_sessions_refresh_token_hash_not_blank',
  `btrim("refresh_token_hash") <> ''`,
)
@Check(
  'CHK_auth_sessions_expiry_after_creation',
  `"expires_at" > "created_at"`,
)
@Check(
  'CHK_auth_sessions_revoked_at_after_creation',
  `"revoked_at" IS NULL OR "revoked_at" >= "created_at"`,
)
export class AuthSessionEntity extends BaseEntity {
  @OneToOne(() => UserEntity, (user) => user.authSession, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: UserEntity;

  @Column({
    name: 'refresh_token_hash',
    type: 'text',
  })
  refreshTokenHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt!: Date | null;
}
