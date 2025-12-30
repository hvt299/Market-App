export const formatCurrency = (value: number) => {
    return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
};

export const getGasColor = (name: string) => {
    if (!name) return '#95A5A6';
    if (name.includes('95')) return '#e67e22';
    if (name.includes('E5')) return '#27AE60';
    if (name.includes('DO') || name.includes('Dầu')) return '#2980b9';
    return '#34495e';
};

export const getPreviousDay = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};