import Link from "next/link";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

type Action =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: Action;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon ? (
        <div className="mb-4 text-muted-foreground [&_svg]:w-10 [&_svg]:h-10">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className={buttonVariants({ size: "lg" })}>
              {action.label}
            </Link>
          ) : (
            <Button size="lg" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
