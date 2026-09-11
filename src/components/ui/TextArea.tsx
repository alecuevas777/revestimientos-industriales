import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/Input';

type Props = ComponentProps<typeof Input>;

export function TextArea(props: Props) {
  return (
    <Input
      multiline
      textAlignVertical="top"
      className="min-h-[140px] py-3"
      {...props}
    />
  );
}
