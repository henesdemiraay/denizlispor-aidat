import UstBaslik from "@/components/UstBaslik";
import IceAktarForm from "@/components/IceAktarForm";
import { yoneticiGerekli } from "@/lib/yetki";

export const dynamic = "force-dynamic";

export default async function IceAktar() {
  await yoneticiGerekli();
  return (
    <>
      <UstBaslik baslik="Excel'den aktar" altBaslik="Sporcu listesini tek seferde ekleyin" geri="/yonetim/sporcular" />
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 lg:pb-12">
        <IceAktarForm />
      </div>
    </>
  );
}
