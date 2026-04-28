export const initModals = (modalEl, modalDeleteEl, modalDuplicateEl) => {
    return {
        main: modalEl ? new bootstrap.Modal(modalEl) : null,
        delete: modalDeleteEl ? new bootstrap.Modal(modalDeleteEl) : null,
        duplicate: modalDuplicateEl ? new bootstrap.Modal(modalDuplicateEl) : null
    };
};