import { useNavigate } from "react-router-dom";
import { DataPreview } from "../components/upload/DataPreview";
import { FileDropzone } from "../components/upload/FileDropzone";
import { Button } from "../components/ui/Button";
import { useCampaign } from "../state/CampaignContext";

export function UploadPage() {
  const navigate = useNavigate();
  const { parsedFile } = useCampaign();
  return (
    <div className="grid gap-6">
      <FileDropzone onComplete={() => navigate("/mapping")} />
      {parsedFile ? (
        <>
          <DataPreview parsedFile={parsedFile} />
          <div className="flex justify-end">
            <Button onClick={() => navigate("/mapping")}>Continue to Analysis Mapping</Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
