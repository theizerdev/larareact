export interface About {
    id: number;
    hero_title: string;
    hero_subtitle: string;
    hero_badge: string;
    bio: string;
    experience_years: string;
    completed_projects: string;
    avatar_path: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Skill {
    id: number;
    name: string;
    proficiency: number;
    category: string;
    order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    image_path: string | null;
    live_url: string | null;
    github_url: string | null;
    category: string;
    is_featured: boolean;
    order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Experience {
    id: number;
    role: string;
    company: string;
    description: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Client {
    id: number;
    name: string;
    logo_path: string | null;
    website_url: string | null;
    order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Message {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    is_read: boolean;
    created_at?: string;
    updated_at?: string;
}
