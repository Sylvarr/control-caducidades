import { RefreshCw } from "lucide-react";
import PropTypes from "prop-types";
import CustomDateInput from "./CustomDateInput";

const CustomCheckbox = ({ id, label, checked, disabled, onChange }) => (
  <div className="flex items-center py-2.5 px-3 my-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`w-4.5 h-4.5 focus:ring-[#1d5030] border-gray-300 rounded
        ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "text-[#1d5030]"
        }`}
    />
    <label
      htmlFor={id}
      className={`pl-2.5 font-medium select-none text-sm
        ${disabled ? "text-gray-400" : "text-[#2d3748]"}`}
    >
      {label}
    </label>
  </div>
);

CustomCheckbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

const UpdateModal = ({
  isOpen,
  isClosing,
  editingProduct,
  updateForm,
  setUpdateForm,
  isUpdating,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center p-4 z-50
        ${isClosing ? "animate-fade-out" : "animate-fade-in"}
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Fondo oscuro clickeable */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className={`
          relative z-10 bg-white rounded-lg w-full max-w-md
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
          transform transition-all duration-300 ease-out
        `}
      >
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-lg font-medium text-[#2d3748] select-none">
            Actualizar estado de{" "}
            <span className="block text-xl text-[#1d5030] font-semibold mt-1">
              {editingProduct?.producto?.nombre}
            </span>
          </h3>
        </div>

        <div className="p-5 space-y-4">
          <CustomDateInput
            label="Fecha Frente"
            value={updateForm.fechaFrente}
            onChange={(value) =>
              setUpdateForm({ ...updateForm, fechaFrente: value })
            }
          />

          <CustomCheckbox
            id="noHayEnAlmacen"
            label="No hay producto en almacén"
            checked={updateForm.noHayEnAlmacen}
            onChange={(checked) =>
              setUpdateForm({
                ...updateForm,
                noHayEnAlmacen: checked,
                fechaAlmacen: checked ? "" : updateForm.fechaAlmacen,
                cajaUnica: checked ? false : updateForm.cajaUnica,
                hayOtrasFechas: checked ? false : updateForm.hayOtrasFechas,
              })
            }
          />

          {!updateForm.noHayEnAlmacen && (
            <CustomDateInput
              label="Fecha Almacén"
              value={updateForm.fechaAlmacen}
              onChange={(value) =>
                setUpdateForm({ ...updateForm, fechaAlmacen: value })
              }
            />
          )}

          <div className="space-y-2">
            <CustomCheckbox
              id="cajaUnica"
              label="Solo queda una caja"
              checked={updateForm.cajaUnica}
              disabled={updateForm.noHayEnAlmacen || updateForm.hayOtrasFechas}
              onChange={(checked) =>
                setUpdateForm({
                  ...updateForm,
                  cajaUnica: checked,
                  hayOtrasFechas: false,
                })
              }
            />

            <CustomCheckbox
              id="hayOtrasFechas"
              label="Hay más fechas"
              checked={updateForm.hayOtrasFechas}
              disabled={updateForm.noHayEnAlmacen || updateForm.cajaUnica}
              onChange={(checked) =>
                setUpdateForm({
                  ...updateForm,
                  hayOtrasFechas: checked,
                  cajaUnica: false,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={onClose}
              className="min-h-[42px] px-5 text-sm font-medium text-[#2d3748]
                bg-gray-50 hover:bg-gray-100
                rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={isUpdating}
              className="min-h-[42px] px-5 text-sm font-medium text-white
                bg-[#1d5030] hover:bg-[#1d5030]/90
                rounded-lg transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

UpdateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isClosing: PropTypes.bool.isRequired,
  editingProduct: PropTypes.shape({
    producto: PropTypes.shape({
      nombre: PropTypes.string,
    }),
  }),
  updateForm: PropTypes.shape({
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    noHayEnAlmacen: PropTypes.bool,
    cajaUnica: PropTypes.bool,
    hayOtrasFechas: PropTypes.bool,
  }).isRequired,
  setUpdateForm: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default UpdateModal;
