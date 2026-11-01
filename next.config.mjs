/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@metamask\/connect-evm|accounts|@x402\/.*)$/,
      })
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@metamask/connect-evm': false,
      'accounts': false,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
    };
    return config;
  },
};

export default nextConfig;
