export interface TreeNodeData {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  description?: string;
  children?: TreeNodeData[];
  dishes?: string[];
  inspiration?: string;
  level: number;
}
