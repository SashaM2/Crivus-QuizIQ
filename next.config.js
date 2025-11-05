/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    // Garantir que módulos nativos só rodem no servidor
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // Ignorar módulos problemáticos no cliente
      config.externals = config.externals || [];
      config.externals.push({
        'argon2': 'commonjs argon2',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
        'mock-aws-s3': 'commonjs mock-aws-s3',
      });
    }
    
    // Ignorar arquivos HTML sendo importados por módulos nativos
    config.module.rules.push({
      test: /\.html$/,
      use: {
        loader: 'null-loader',
      },
    });

    return config;
  },
};

module.exports = nextConfig;

