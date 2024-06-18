export const handleError = (error: Error, callback: Function | null, message: string) => {
  console.error(message, error);
  if (callback) callback({ status: "error", message });
};
