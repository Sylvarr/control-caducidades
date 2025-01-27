import PropTypes from "prop-types";
import { Modal } from "../../../shared/components/Modal";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { AlertTriangle } from "lucide-react";

export const ConflictModal = ({ isOpen, onClose, conflicts, onResolve }) => {
  const handleResolveAll = () => {
    const resolution = conflicts.map((conflict) => ({
      productId: conflict.productId,
      changes: conflict.serverVersion,
    }));
    onResolve(resolution);
  };

  const handleKeepLocal = () => {
    const resolution = conflicts.map((conflict) => ({
      productId: conflict.productId,
      changes: conflict.localVersion,
    }));
    onResolve(resolution);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conflictos de Sincronización"
    >
      <div className="space-y-6">
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <div>
            <h4 className="font-semibold">
              Se detectaron {conflicts.length} conflictos
            </h4>
            <p className="text-sm">
              Los siguientes productos han sido modificados en el servidor
              mientras trabajabas. Por favor, elige cómo resolver los
              conflictos.
            </p>
          </div>
        </Alert>

        {/* Lista de conflictos */}
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div
              key={conflict.productId}
              className="border rounded-lg p-4 space-y-4"
            >
              <div>
                <h4 className="font-semibold">{conflict.nombre}</h4>
                <p className="text-sm text-gray-600">
                  ID: {conflict.productId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Versión Local</h5>
                  <pre className="text-xs bg-gray-50 p-2 rounded">
                    {JSON.stringify(conflict.localVersion, null, 2)}
                  </pre>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">
                    Versión del Servidor
                  </h5>
                  <pre className="text-xs bg-gray-50 p-2 rounded">
                    {JSON.stringify(conflict.serverVersion, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-yellow-600 hover:text-yellow-700"
            onClick={handleKeepLocal}
          >
            Mantener cambios locales
          </Button>
          <Button type="button" onClick={handleResolveAll}>
            Usar versión del servidor
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConflictModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  conflicts: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      localVersion: PropTypes.object.isRequired,
      serverVersion: PropTypes.object.isRequired,
    })
  ).isRequired,
  onResolve: PropTypes.func.isRequired,
};
