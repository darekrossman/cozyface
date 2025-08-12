import Link from "next/link";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1>Cozyface</h1>
			<div>
				<Link href="/auth/login">Login</Link>
			</div>
		</div>
	);
}
