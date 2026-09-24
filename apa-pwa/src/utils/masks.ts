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

/** Monta link wa.me com DDI 55. Retorna null se o telefone for inválido. */
export const toWhatsAppLink = (phone: string, message?: string): string | null => {
    const digits = unmask(phone);
    if (digits.length < 10 || digits.length > 13) return null;

    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    const base = `https://wa.me/${withCountry}`;
    if (!message) return base;
    return `${base}?text=${encodeURIComponent(message)}`;
};
