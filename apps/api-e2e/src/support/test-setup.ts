import axios from 'axios';
import { loadDockerEnvFile } from './load-docker-env';

module.exports = async function () {
  loadDockerEnvFile();

  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
