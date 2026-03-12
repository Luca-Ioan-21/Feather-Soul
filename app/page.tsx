// app/page.tsx

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirecționează automat vizitatorii de la ruta de bază (/) către /write
  redirect('/write');

  // Nu este nevoie de un return JSX, deoarece redirecționarea are loc imediat.
}