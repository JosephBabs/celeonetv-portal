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
  founders: {
    chariowPassUrl: import.meta.env.VITE_CHARIOW_FOUNDERS_PASS_URL || "",
    supportEmail: import.meta.env.VITE_FOUNDERS_SUPPORT_EMAIL || "support@celeonetv.com",
    verificationBaseUrl: import.meta.env.VITE_FOUNDERS_VERIFICATION_BASE_URL || "https://celeonetv.com/founders/verify",
    levels: [
      { id: "supporter", label: "Supporter", minAmount: 1000, currency: "FCFA" },
      { id: "builder", label: "Builder", minAmount: 5000, currency: "FCFA" },
      { id: "pioneer", label: "Pioneer", minAmount: 25000, currency: "FCFA" },
      { id: "legacy", label: "Legacy", minAmount: 100000, currency: "FCFA" },
    ],
  },
};
