import { useState } from "react";
import PropTypes from "prop-types";
import ModalContainer from "./ModalContainer";

const ConflictResolutionModal = ({
  isOpen,
  isClosing,
  conflicts,
  onClose,
  onResolveConflicts,
}) => {
  const [resolutions, setResolutions] = useState({});

  const handleResolutionSelect = (conflictId, resolution) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: resolution,
    }));
  };

  const handleResolveAll = async () => {
    await onResolveConflicts(resolutions);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No establecida";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderConflictDetails = (conflict) => {
    const {
      data: localVersion,
      conflictData: { serverState: serverVersion },
    } = conflict;

    return (
      <div key={conflict.id} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">
          {localVersion.producto.nombre}
        </h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">
              Versión Local
            </h5>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline text-gray-600">Fecha Frente: </dt>
                <dd className="inline">
                  {formatDate(localVersion.fechaFrente)}
                </dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Fecha Almacén: </dt>
                <dd className="inline">
                  {formatDate(localVersion.fechaAlmacen)}
                </dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Estado: </dt>
                <dd className="inline">{localVersion.estado}</dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Versión: </dt>
                <dd className="inline">{localVersion.version}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">
              Versión Servidor
            </h5>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline text-gray-600">Fecha Frente: </dt>
                <dd className="inline">
                  {formatDate(serverVersion.fechaFrente)}
                </dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Fecha Almacén: </dt>
                <dd className="inline">
                  {formatDate(serverVersion.fechaAlmacen)}
                </dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Estado: </dt>
                <dd className="inline">{serverVersion.estado}</dd>
              </div>
              <div>
                <dt className="inline text-gray-600">Versión: </dt>
                <dd className="inline">{serverVersion.version}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleResolutionSelect(conflict.id, "local")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
              resolutions[conflict.id] === "local"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Mantener Local
          </button>
          <button
            onClick={() => handleResolutionSelect(conflict.id, "server")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
              resolutions[conflict.id] === "server"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Usar Servidor
          </button>
          <button
            onClick={() => handleResolutionSelect(conflict.id, "merge")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
              resolutions[conflict.id] === "merge"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Combinar
          </button>
        </div>
      </div>
    );
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      isClosing={isClosing}
      onClose={onClose}
      title={`Conflictos Detectados (${conflicts.length})`}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        <p className="text-sm text-gray-600 mb-4">
          Se han detectado conflictos en algunos productos. Por favor,
          seleccione cómo desea resolver cada conflicto.
        </p>

        {conflicts.map(renderConflictDetails)}

        <div className="sticky bottom-0 bg-white p-4 border-t">
          <button
            onClick={handleResolveAll}
            disabled={Object.keys(resolutions).length !== conflicts.length}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 transition-colors disabled:bg-gray-300"
          >
            Resolver Todos los Conflictos
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

ConflictResolutionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isClosing: PropTypes.bool.isRequired,
  conflicts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      productId: PropTypes.string.isRequired,
      data: PropTypes.object.isRequired,
      conflictData: PropTypes.shape({
        serverState: PropTypes.object.isRequired,
        serverVersion: PropTypes.number.isRequired,
      }).isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onResolveConflicts: PropTypes.func.isRequired,
};

export default ConflictResolutionModal;
