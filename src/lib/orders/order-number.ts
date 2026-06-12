function pad(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

export function generateOrderNo(now = new Date()) {
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

  return `DJ${timestamp}${suffix}`;
}
