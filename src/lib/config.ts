export const APP = {
  brand: {
    name: "Celeone",
    primary: "#14B8A6", // teal
    logoWordmark: "/logo.png",
    logoIcon: "/favicon.png",
    logoShare: "https://celeonetv.com/logo.png",
  },
  streaming: {
    rtmpBase: "rtmp://live.celeonetv.com/live",
    hlsBase: "https://live.celeonetv.com/hls",
    publicLiveBase: "https://live.celeonetv.com", // or celeonetv.com depending on your DNS
  },
  donations: {
    paymentUrl: import.meta.env.VITE_DONATION_PAYMENT_URL || "https://celeonetv.com/donate",
  },
};
