import { RefreshCw, Plus, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import CustomDateInput from "./CustomDateInput";
import ModalContainer from "./ModalContainer";
import { validateProductData } from "@shared/validators/productValidators";
import { classifyProduct } from "@shared/business/productClassifier";
import { PRODUCT_STATES } from "@shared/models/Product";

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

const ConfirmDialog = ({ onConfirm, onCancel, title, message }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
    <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-white rounded-lg p-5 max-w-sm w-full mx-4 z-10 animate-slide-down">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-[#f59e0b] hover:bg-[#f59e0b]/90 rounded-lg transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

ConfirmDialog.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
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
  setShowUnclassified,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNoHayEnAlmacen, setPendingNoHayEnAlmacen] = useState(false);
  const [dateErrors, setDateErrors] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    fechaAlmacen2: "",
    fechaAlmacen3: "",
  });
  const [calculatedState, setCalculatedState] = useState(
    PRODUCT_STATES.SIN_CLASIFICAR
  );
  const [showFrontDateDialog, setShowFrontDateDialog] = useState(false);

  // Validar fechas y calcular estado cuando cambien
  useEffect(() => {
    // Solo validar si hay fecha frente
    if (!updateForm.fechaFrente) {
      setDateErrors({
        fechaFrente: "",
        fechaAlmacen: "",
        fechaAlmacen2: "",
        fechaAlmacen3: "",
      });
      setCalculatedState(PRODUCT_STATES.SIN_CLASIFICAR);
      return;
    }

    const fechasAlmacen = [];
    if (!updateForm.noHayEnAlmacen) {
      if (updateForm.fechaAlmacen) {
        fechasAlmacen.push(updateForm.fechaAlmacen);
      }
      if (updateForm.showSecondDate && updateForm.fechaAlmacen2) {
        fechasAlmacen.push(updateForm.fechaAlmacen2);
      }
      if (updateForm.showThirdDate && updateForm.fechaAlmacen3) {
        fechasAlmacen.push(updateForm.fechaAlmacen3);
      }
    }

    const productData = {
      fechaFrente: updateForm.fechaFrente,
      fechaAlmacen: updateForm.noHayEnAlmacen ? null : updateForm.fechaAlmacen,
      fechasAlmacen,
      cajaUnica: Boolean(updateForm.cajaUnica),
    };

    const validationResult = validateProductData(productData);
    const newErrors = {
      fechaFrente: "",
      fechaAlmacen: "",
      fechaAlmacen2: "",
      fechaAlmacen3: "",
    };

    validationResult.errors.forEach((error) => {
      if (error.includes("fecha de frente")) {
        newErrors.fechaFrente = "Fecha inválida";
      } else if (error.includes("fecha de almacén #2")) {
        newErrors.fechaAlmacen2 = "La fecha es anterior a Fecha Almacén";
      } else if (error.includes("fecha de almacén #3")) {
        newErrors.fechaAlmacen3 = "La fecha es anterior a Segunda Fecha";
      } else if (error.includes("fecha de almacén")) {
        newErrors.fechaAlmacen = "La fecha es anterior a Fecha Frente";
      }
    });

    setDateErrors(newErrors);

    // Calcular estado solo si no hay errores
    if (validationResult.isValid) {
      try {
        const estado = classifyProduct(productData);
        setCalculatedState(estado);
      } catch (error) {
        console.error("Error al clasificar producto:", error);
        setCalculatedState(PRODUCT_STATES.SIN_CLASIFICAR);
      }
    }
  }, [updateForm]);

  // Función para manejar la eliminación de la fecha de frente
  const handleFrontDateRemoval = () => {
    // Si no hay fecha de almacén, simplemente eliminar la fecha de frente
    if (!updateForm.fechaAlmacen) {
      setUpdateForm((prev) => ({
        ...prev,
        fechaFrente: "",
      }));
      return;
    }

    // Verificar si la fecha de frente coincide con la primera fecha de almacén
    const frontDate = new Date(updateForm.fechaFrente).setHours(0, 0, 0, 0);
    const storageDate = new Date(updateForm.fechaAlmacen).setHours(0, 0, 0, 0);

    if (frontDate === storageDate) {
      // Caso 1: Las fechas coinciden - Mantener la fecha de frente y mover las fechas de almacén
      const currentFrontDate = updateForm.fechaFrente;
      setUpdateForm({
        ...updateForm,
        fechaFrente: currentFrontDate, // Mantener explícitamente la fecha de frente
        fechaAlmacen: updateForm.fechaAlmacen2 || "",
        fechaAlmacen2: updateForm.fechaAlmacen3 || "",
        fechaAlmacen3: "",
        showThirdDate: false,
        showSecondDate: Boolean(updateForm.fechaAlmacen3),
      });
    } else {
      // Caso 2: Las fechas son diferentes - Mostrar diálogo
      setShowFrontDateDialog(true);
    }
  };

  // Función para manejar cuando todo el producto pasa al frente
  const handleAllToFront = () => {
    setUpdateForm((prev) => ({
      ...prev,
      fechaFrente: prev.fechaAlmacen,
      fechaAlmacen: prev.fechaAlmacen2 || "",
      fechaAlmacen2: prev.fechaAlmacen3 || "",
      fechaAlmacen3: "",
      showSecondDate: Boolean(prev.fechaAlmacen3),
    }));
    setShowFrontDateDialog(false);
  };

  // Función para manejar cuando solo parte del producto pasa al frente
  const handlePartialToFront = () => {
    setUpdateForm((prev) => ({
      ...prev,
      fechaFrente: prev.fechaAlmacen,
    }));
    setShowFrontDateDialog(false);
  };

  // Función para manejar la eliminación de fechas de almacén
  const handleStorageDateRemoval = (dateNumber) => {
    setUpdateForm((prev) => {
      const newState = { ...prev };

      if (dateNumber === 1) {
        // La primera fecha de almacén se elimina, las demás avanzan
        newState.fechaAlmacen = prev.fechaAlmacen2 || "";
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.fechaAlmacen3 = "";
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 2) {
        // La segunda fecha se elimina, la tercera avanza
        newState.fechaAlmacen2 = prev.fechaAlmacen3 || "";
        newState.fechaAlmacen3 = "";
        newState.showThirdDate = false;
        newState.showSecondDate = Boolean(prev.fechaAlmacen3);
      } else if (dateNumber === 3) {
        // La tercera fecha simplemente se elimina
        newState.fechaAlmacen3 = "";
        newState.showThirdDate = false;
      }

      return newState;
    });
  };

  const title = (
    <div className="text-[#2d3748]">
      <span className="font-medium">Actualizar estado de</span>
      <span className="block text-[#1d5030] font-semibold mt-1">
        {editingProduct?.producto?.nombre}
      </span>
    </div>
  );

  const handleAddDate = () => {
    if (!updateForm.fechaAlmacen) {
      return;
    }

    if (!updateForm.showSecondDate) {
      setUpdateForm((prev) => ({
        ...prev,
        showSecondDate: true,
        fechaAlmacen2: "",
        cajaUnica: false,
      }));
      // Limpiar cualquier error previo al añadir una nueva fecha
      setDateErrors((prev) => ({
        ...prev,
        fechaAlmacen2: "",
      }));
      setTimeout(() => {
        const dateInput = document.querySelector(
          '[data-date-input="fechaAlmacen2"]'
        );
        if (dateInput) {
          dateInput.click();
        }
      }, 100);
    } else if (!updateForm.showThirdDate) {
      setUpdateForm((prev) => ({
        ...prev,
        showThirdDate: true,
        fechaAlmacen3: "",
        cajaUnica: false,
      }));
      // Limpiar cualquier error previo al añadir una nueva fecha
      setDateErrors((prev) => ({
        ...prev,
        fechaAlmacen3: "",
      }));
      setTimeout(() => {
        const dateInput = document.querySelector(
          '[data-date-input="fechaAlmacen3"]'
        );
        if (dateInput) {
          dateInput.click();
        }
      }, 100);
    }
  };

  const canAddMoreDates =
    !updateForm.noHayEnAlmacen &&
    updateForm.fechaAlmacen &&
    !dateErrors.fechaAlmacen && // Solo permitir añadir si la fecha principal es válida
    (!updateForm.showSecondDate ||
      (updateForm.showSecondDate &&
        updateForm.fechaAlmacen2 &&
        !dateErrors.fechaAlmacen2 &&
        !updateForm.showThirdDate));

  const handleNoHayEnAlmacenChange = (checked) => {
    // Si hay fechas adicionales y se está marcando la casilla, mostrar confirmación
    if (checked && (updateForm.fechaAlmacen2 || updateForm.fechaAlmacen3)) {
      setShowConfirmDialog(true);
      setPendingNoHayEnAlmacen(true);
      return;
    }

    // Si no hay fechas adicionales o se está desmarcando, proceder normalmente
    setUpdateForm({
      ...updateForm,
      noHayEnAlmacen: checked,
      fechaAlmacen: checked ? "" : updateForm.fechaAlmacen,
      fechaAlmacen2: "",
      fechaAlmacen3: "",
      showSecondDate: false,
      showThirdDate: false,
      cajaUnica: checked ? false : updateForm.cajaUnica,
    });
  };

  const handleConfirmNoHayEnAlmacen = () => {
    setUpdateForm({
      ...updateForm,
      noHayEnAlmacen: true,
      fechaAlmacen: "",
      fechaAlmacen2: "",
      fechaAlmacen3: "",
      showSecondDate: false,
      showThirdDate: false,
      cajaUnica: false,
    });
    setShowConfirmDialog(false);
    setPendingNoHayEnAlmacen(false);
  };

  const handleCancelNoHayEnAlmacen = () => {
    setShowConfirmDialog(false);
    setPendingNoHayEnAlmacen(false);
  };

  return (
    <>
      <ModalContainer
        isOpen={isOpen}
        isClosing={isClosing}
        onClose={onClose}
        title={title}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 p-5 space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <CustomDateInput
                  label="Fecha Frente"
                  value={updateForm.fechaFrente}
                  onChange={(value) =>
                    setUpdateForm({ ...updateForm, fechaFrente: value })
                  }
                  onRemove={handleFrontDateRemoval}
                />
                {dateErrors.fechaFrente && (
                  <p className="mt-1 text-sm text-red-600">
                    {dateErrors.fechaFrente}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <CustomCheckbox
                    id="noHayEnAlmacen"
                    label="No hay producto en almacén"
                    checked={updateForm.noHayEnAlmacen || pendingNoHayEnAlmacen}
                    onChange={handleNoHayEnAlmacenChange}
                  />
                </div>
              </div>

              {!updateForm.noHayEnAlmacen && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex flex-col space-y-4">
                      <CustomDateInput
                        label="Fecha Almacén"
                        value={updateForm.fechaAlmacen}
                        onChange={(value) =>
                          setUpdateForm({
                            ...updateForm,
                            fechaAlmacen: value,
                            ...(value === "" && {
                              fechaAlmacen2: "",
                              fechaAlmacen3: "",
                              showSecondDate: false,
                              showThirdDate: false,
                            }),
                          })
                        }
                        onRemove={() => handleStorageDateRemoval(1)}
                        disabled={!updateForm.fechaFrente}
                      />
                      {dateErrors.fechaAlmacen && (
                        <p className="mt-1 text-sm text-red-600">
                          {dateErrors.fechaAlmacen}
                        </p>
                      )}

                      {updateForm.showSecondDate && (
                        <div className="relative">
                          <CustomDateInput
                            label="Segunda Fecha"
                            value={updateForm.fechaAlmacen2}
                            onChange={(value) => {
                              setUpdateForm({
                                ...updateForm,
                                fechaAlmacen2: value,
                                ...(value === "" && {
                                  fechaAlmacen3: "",
                                  showThirdDate: false,
                                }),
                              });
                            }}
                            data-date-input="fechaAlmacen2"
                            onRemove={() => handleStorageDateRemoval(2)}
                            showRemoveWhenEmpty
                            disabled={
                              !updateForm.fechaAlmacen ||
                              dateErrors.fechaAlmacen
                            }
                          />
                          {dateErrors.fechaAlmacen2 && (
                            <p className="mt-1 text-sm text-red-600">
                              {dateErrors.fechaAlmacen2}
                            </p>
                          )}
                        </div>
                      )}

                      {updateForm.showThirdDate && (
                        <div className="relative">
                          <CustomDateInput
                            label="Tercera Fecha"
                            value={updateForm.fechaAlmacen3}
                            onChange={(value) => {
                              setUpdateForm({
                                ...updateForm,
                                fechaAlmacen3: value,
                              });
                            }}
                            data-date-input="fechaAlmacen3"
                            onRemove={() => handleStorageDateRemoval(3)}
                            showRemoveWhenEmpty
                            disabled={
                              !updateForm.fechaAlmacen2 ||
                              dateErrors.fechaAlmacen2
                            }
                          />
                          {dateErrors.fechaAlmacen3 && (
                            <p className="mt-1 text-sm text-red-600">
                              {dateErrors.fechaAlmacen3}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {canAddMoreDates && (
                    <button
                      onClick={handleAddDate}
                      className="w-full py-2 px-3 flex items-center justify-center gap-2
                        text-sm font-medium text-[#1d5030] bg-[#1d5030]/10
                        hover:bg-[#1d5030]/20 rounded-lg transition-colors duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        !updateForm.fechaAlmacen || dateErrors.fechaAlmacen
                      }
                    >
                      <Plus className="w-4 h-4" />
                      Añadir fecha adicional
                    </button>
                  )}

                  <CustomCheckbox
                    id="cajaUnica"
                    label="Solo queda una caja"
                    checked={updateForm.cajaUnica}
                    disabled={
                      updateForm.noHayEnAlmacen || updateForm.showSecondDate
                    }
                    onChange={(checked) =>
                      setUpdateForm({
                        ...updateForm,
                        cajaUnica: checked,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center w-full p-5 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Estado calculado:{" "}
              <span className="font-medium">
                {calculatedState.replace(/-/g, " ").toUpperCase()}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="min-h-[42px] px-5 text-sm font-medium text-[#2d3748]
                  bg-gray-50 hover:bg-gray-100
                  rounded-lg transition-colors duration-200"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await onSubmit(e);
                  if (!isUpdating) {
                    onClose();
                    // Cerrar también la lista de sin clasificar
                    setShowUnclassified(false);
                  }
                }}
                disabled={
                  isUpdating ||
                  !updateForm.fechaFrente ||
                  Object.values(dateErrors).some((error) => error !== "")
                }
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
      </ModalContainer>

      {showConfirmDialog && (
        <ConfirmDialog
          title="¿Estás seguro?"
          message="Se perderán todas las fechas de almacén que hayas añadido."
          onConfirm={handleConfirmNoHayEnAlmacen}
          onCancel={handleCancelNoHayEnAlmacen}
        />
      )}

      {showFrontDateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowFrontDateDialog(false)}
          />
          <div className="relative bg-white rounded-lg p-5 max-w-sm w-full mx-4 z-10 animate-slide-down">
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Qué deseas hacer?
                </h3>
                <p className="text-sm text-gray-600">
                  Al quitar la fecha de frente, ¿cómo deseas manejar el producto
                  del almacén?
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleAllToFront}
                className="w-full px-4 py-2.5 text-sm font-medium text-white
                  bg-[#1d5030] hover:bg-[#1d5030]/90 rounded-lg transition-colors"
              >
                Todo el producto pasa al frente
              </button>
              <button
                onClick={handlePartialToFront}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#1d5030]
                  bg-[#1d5030]/10 hover:bg-[#1d5030]/20 rounded-lg transition-colors"
              >
                Solo una parte pasa al frente
              </button>
              <button
                onClick={() => setShowFrontDateDialog(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700
                  bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    fechaAlmacen2: PropTypes.string,
    fechaAlmacen3: PropTypes.string,
    noHayEnAlmacen: PropTypes.bool,
    cajaUnica: PropTypes.bool,
    showSecondDate: PropTypes.bool,
    showThirdDate: PropTypes.bool,
  }).isRequired,
  setUpdateForm: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  setShowUnclassified: PropTypes.func.isRequired,
};
export default UpdateModal;
