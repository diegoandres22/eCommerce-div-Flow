// File: components/logo.tsx
import Image from 'next/image';

// Alterna por CSS (sin JS) según la clase `dark` que next-themes pone en
// <html>: evita cualquier parpadeo/mismatch de hidratación.
export function Logo() {
  return (
    <>
      <Image
        src="/images/logolight.png"
        alt="Logo"
        width={32}
        height={32}
        className="block dark:hidden"
        priority
      />
      <Image
        src="/images/logodark.png"
        alt="Logo"
        width={32}
        height={32}
        className="hidden dark:block"
        priority
      />
    </>
  );
}
