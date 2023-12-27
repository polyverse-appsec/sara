import * as React from 'react';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  // Other imports if necessary
} from '@/components/ui/select'; // Update the import path

interface Option {
  value: string;
  label: string;
}

interface GitHubSelectProps {
  label: string;
  options: Option[];
}

const GitHubSelect: React.FC<GitHubSelectProps> = ({ label, options }) => {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default GitHubSelect;
