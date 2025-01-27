import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../../auth/hooks/useAuth";
import { useToasts } from "../../../core/hooks/useToasts";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { Spinner } from "../../../shared/components/Spinner";
import { Plus } from "lucide-react";

// Componentes
import { SearchBar } from "./SearchBar";
import { UserFilters } from "./UserFilters";
import { UserList } from "./UserList";
import { CreateModal } from "./CreateModal";
import { UpdateModal } from "./UpdateModal";

export const UserManagement = () => {
  const { hasPermission } = useAuth();
  const { addToast } = useToasts();
  const [selectedUser, setSelectedUser] = useState(null);

  // Modales
  const {
    isOpen: isCreateModalOpen,
    onOpen: openCreateModal,
    onClose: closeCreateModal,
  } = useModal();

  const {
    isOpen: isUpdateModalOpen,
    onOpen: openUpdateModal,
    onClose: closeUpdateModal,
  } = useModal();

  // Usar el hook de usuarios
  const {
    users,
    filters,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    setFilters,
    clearFilters,
    isUpdating,
    isDeleting,
  } = useUsers({
    sortBy: "username",
    sortOrder: "asc",
  });

  // Manejadores de eventos
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    openUpdateModal();
  };

  const handleUserCreate = async (userData) => {
    try {
      await createUser(userData);
      addToast({
        type: "success",
        message: "Usuario creado correctamente",
      });
      closeCreateModal();
    } catch {
      addToast({
        type: "error",
        message: "Error al crear el usuario",
      });
    }
  };

  const handleUserUpdate = async (changes) => {
    try {
      await updateUser(selectedUser._id, changes);
      addToast({
        type: "success",
        message: "Usuario actualizado correctamente",
      });
      closeUpdateModal();
    } catch {
      addToast({
        type: "error",
        message: "Error al actualizar el usuario",
      });
    }
  };

  const handleUserDelete = async (id) => {
    try {
      await deleteUser(id);
      addToast({
        type: "success",
        message: "Usuario eliminado correctamente",
      });
    } catch {
      addToast({
        type: "error",
        message: "Error al eliminar el usuario",
      });
    }
  };

  if (error) {
    return (
      <Alert variant="error" className="m-4">
        Error al cargar usuarios: {error}
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-600">{users.length} usuarios en total</p>
        </div>
        {hasPermission("users:manage") && (
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm}
            onChange={(value) => setFilters({ searchTerm: value })}
          />
        </div>
        <UserFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      ) : (
        <UserList
          users={users}
          onSelect={handleUserSelect}
          onDelete={handleUserDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      )}

      {/* Modales */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreate={handleUserCreate}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        user={selectedUser}
        onUpdate={handleUserUpdate}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default UserManagement;
