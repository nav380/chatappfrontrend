export default {
  reactStrictMode: true,
  async headers() {
      return [
          {
              source: "/:path*",
              headers: [
                  { key: "Access-Control-Allow-Credentials", value: "true" },
                  { key: "Access-Control-Allow-Origin", value: "http://192.168.1.8:9877/" },
                  { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                  { key: "Access-Control-Allow-Headers", value: "X-CSRFToken, Content-Type" },
              ],
          },
      ];
  },
};
