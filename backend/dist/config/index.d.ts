interface Config {
    port: number;
    nodeEnv: string;
    mongodbUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    frontendUrl: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map