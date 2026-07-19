import { Inbox } from 'lucide-react';

import styles from './empty-state.module.css';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.empty} aria-label={title}>
      <Inbox aria-hidden="true" size={24} />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
