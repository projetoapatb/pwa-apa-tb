export const maskPhone = (value: string) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    const limited = digits.slice(0, 11);

    if (limited.length <= 10) {
        return limited
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
        return limited
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }
};

export const unmask = (value: string) => value.replace(/\D/g, "");

export const validatePhone = (value: string) => {
    const digits = unmask(value);
    return digits.length === 11;
};
