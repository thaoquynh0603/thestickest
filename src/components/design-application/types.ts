export interface ApplicationQuestion {
  id: string;
  question_text: string;
  subtext?: string | null;
  question_type: string;
  options?: string[];
  option_items?: Array<{
    id?: string;
    name: string;
    description?: string | null;
    image_url?: string | null;
  }>;
  is_required: boolean;
  sort_order: number;
  is_customisable: boolean;
  custom_template_id?: string | null;
}

export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

export interface ApplicationData {
  email: string;
  [key: string]: string | File | string[] | undefined;
}


