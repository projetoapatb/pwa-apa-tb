export type PetSize = 'P' | 'M' | 'G';
export type PetSpecies = 'Cachorro' | 'Gato';
export type PetGender = 'Macho' | 'Fêmea';
export type PetStatus = 'disponível' | 'adotado' | 'indisponível' | 'pendente';

export interface Pet {
    id: string;
    species: PetSpecies;
    gender: PetGender;
    name: string;
    breed?: string;
    color?: string;
    age: number | string;
    size: PetSize;
    tags: string[];
    status: PetStatus;
    description: string;
    photos: string[];
    address?: string;
    contactPhone?: string;
    userId?: string; // ID do usuário que cadastrou
    sortOrder?: number;
    createdAt: any;
    updatedAt: any;
}

export interface FeatureFlags {
    adoption: boolean;
    donations: boolean;
    lostPets: boolean;
    partners: boolean;
    stories: boolean;
    volunteers: boolean;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    phone?: string;
    role: 'user' | 'admin';
    // Novos campos para Lar Temporário (Centralizados no Perfil)
    address?: string;
    dwellingType?: string;
    hasOtherPets?: string;
    petDetails?: string;
    householdCount?: string;
    spaceDescription?: string;
    availability?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface LeadAdoption {
    id: string;
    petId: string;
    petName: string;
    userId: string;
    name: string;
    phone: string;
    email: string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected' | 'contacted';
    rejectionReason?: string;
    createdAt: any;
    updatedAt?: any;
}

export interface LeadVolunteer {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    area: string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected' | 'contacted';
    rejectionReason?: string;
    createdAt: any;
    updatedAt?: any;
}

export interface Partner {
    id: string;
    name: string;
    logo: string;
    website?: string;
    description?: string;
    order: number;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    image: string;
    category: 'notícia' | 'resultado' | 'evento' | 'história';
    publishDate: any;
    author: string;
    isActive: boolean;
    isHighlighted?: boolean;
    createdAt: any;

    updatedAt: any;
}

export interface GlobalSettings {
    pixKey: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    socialInstagram?: string;
    socialFacebook?: string;
    donationItems: string[];
    updatedAt: any;
}
export interface MonthlyResult {
    id: string; // Formato YYYYMM
    helpedCount: number;
    notes?: string;
    updatedAt: any;
}

export interface LostPet {
    id: string;
    name: string;
    species: 'cachorro' | 'gato' | 'outro';
    description: string;
    lastSeenLocation: string;
    lastSeenDate: any;
    contactPhone: string;
    photoUrl: string;
    status: 'perdido' | 'encontrado';
    moderationStatus: 'pending' | 'approved' | 'rejected';
    hasReward?: boolean;
    rewardValue?: string;
    userId: string;
    createdAt: any;
}
export interface LeadLT {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    dwellingType: 'casa' | 'apartamento' | 'sitio';
    hasOtherPets: 'sim' | 'nao';
    petDetails?: string;
    householdCount: string;
    spaceDescription: string;
    availability: string;
    status: 'pending' | 'approved' | 'rejected' | 'contacted';
    rejectionReason?: string;
    createdAt: any;
    updatedAt?: any;
}
