declare global {
  namespace NodeJS {
    interface ProcessEnv {
//server
      PORT: int;
// Database
      DB_HOST: string;
      DB_PORT: int;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
    }
  }
}

export {};