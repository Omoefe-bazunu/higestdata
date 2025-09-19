// import AppHeader from "@/components/shared/app-header";
// import AppSidebar from "@/components/shared/app-sidebar";
import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";

export default function layout({ children }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-col w-full min-w-0">
        <Header />
        <main className="">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
