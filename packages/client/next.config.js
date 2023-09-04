/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve = {
                ...config.resolve,
                fallback: {
                    ...config.resolve.fallback,
                    fs: false,
                },
            };
        }
        config.module = {
            ...config.module,
            exprContextCritical: false,
        };
        return config;
    },
};

module.exports = nextConfig;
