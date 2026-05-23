import { useRef } from "react";
import useStore from "../../store/store";

function UploadPanel() {
  const fileInputRef = useRef(null);
  const { setYamlText, setError } = useStore();

  function handleFile(file) {
    // Make sure it's a YAML file
    if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
      setError("Please upload a .yaml or .yml file");
      return;
    }

    // Read the file contents as text
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setYamlText(text);
    };
    reader.readAsText(file);
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  return (
    <div className="p-4 border-b border-gray-800">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Upload YAML
      </h2>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-colors"
      >
        <p className="text-gray-400 text-sm">
          Drag & drop a Kubernetes YAML file here
        </p>
        <p className="text-gray-600 text-xs mt-1">or click to browse</p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default UploadPanel;