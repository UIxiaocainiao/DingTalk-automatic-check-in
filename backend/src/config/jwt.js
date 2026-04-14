module.exports = {
  SECRET: process.env.JWT_SECRET || "change-me",
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
