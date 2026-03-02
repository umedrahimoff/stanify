export const formatDate = (d: Date | string) => {
    const x = new Date(d);
    const day = x.getDate().toString().padStart(2, "0");
    const month = (x.getMonth() + 1).toString().padStart(2, "0");
    const year = x.getFullYear();
    return `${day}:${month}:${year}`;
};
