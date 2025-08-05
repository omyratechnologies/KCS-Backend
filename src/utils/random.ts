export const genOTP = (length: number): number => Math.floor(Math.random() * Math.pow(10, length));
