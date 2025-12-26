import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonBadge,
    IonFab,
    IonFabButton,
    AlertController,
    ToastController,
    Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    searchOutline,
    createOutline,
    trashOutline,
    checkmarkCircle,
    closeCircle,
    logOutOutline,
    pricetagOutline,
    eyeOutline,
    eyeOffOutline,
    arrowBackOutline
} from 'ionicons/icons';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-products',
    templateUrl: './products.page.html',
    styleUrls: ['./products.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButtons,
        IonButton,
        IonIcon,
        IonSearchbar,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonList,
        IonItem,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonBadge,
        IonFab,
        IonFabButton
    ]
})
export class ProductsPage implements OnInit, OnDestroy {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];
    selectedCategory: string = 'all';
    searchTerm: string = '';
    showDeleteAlert = false;
    showToast = false;
    toastMessage = '';
    productToDelete: Product | null = null;

    constructor(
        private productService: ProductService,
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController,
        private toastController: ToastController,
        private platform: Platform
    ) {
        addIcons({
            addOutline,
            searchOutline,
            createOutline,
            trashOutline,
            checkmarkCircle,
            closeCircle,
            logOutOutline,
            pricetagOutline,
            eyeOutline,
            eyeOffOutline,
            arrowBackOutline
        });
    }

    async ngOnInit() {
        await this.loadProducts();
        await this.loadCategories();

        // Registrar listener para el botón de atrás del hardware con alta prioridad
        this.platform.backButton.subscribeWithPriority(10, () => {
            // Navegar al menú admin
            this.router.navigate(['/admin-menu']);
        });
    }

    ngOnDestroy() {
        // No necesitamos limpiar explícitamente, Angular lo hace automáticamente
    }

    async ionViewWillEnter() {
        // Recargar productos cada vez que se entra a la página
        await this.loadProducts();
        await this.loadCategories();
    }

    async loadProducts() {
        this.products = await this.productService.getAllProducts();
        this.filterProducts();
    }

    async loadCategories() {
        this.categories = await this.productService.getCategories();
    }

    filterProducts() {
        let filtered = [...this.products];

        // Filtrar por categoría
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }

        // Filtrar por búsqueda
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                (p.category && p.category.toLowerCase().includes(term))
            );
        }

        this.filteredProducts = filtered;
    }

    onSearchChange(event: any) {
        this.searchTerm = event.detail.value || '';
        this.filterProducts();
    }

    onCategoryChange(event: any) {
        this.selectedCategory = event.detail.value;
        this.filterProducts();
    }

    addProduct() {
        this.router.navigate(['/products/form']);
    }

    editProduct(product: Product) {
        this.router.navigate(['/products/form'], {
            queryParams: { id: product.id_local }
        });
    }

    async confirmDelete(product: Product) {
        const alert = await this.alertController.create({
            header: '¿Eliminar producto?',
            message: `¿Estás seguro de que deseas eliminar "${product.name}"? El producto se quitará del listado pero se mantendrá en el sistema.`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => {
                        this.deleteProduct(product);
                    }
                }
            ]
        });

        await alert.present();
    }

    async deleteProduct(product: Product) {
        try {
            await this.productService.deleteProduct(product.id_local);
            await this.showToastMessage(`"${product.name}" eliminado correctamente`);
            await this.loadProducts();
            await this.loadCategories();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            await this.showToastMessage('Error al eliminar producto', 'danger');
        }
    }

    async toggleStatus(product: Product) {
        try {
            await this.productService.toggleProductStatus(product.id_local);
            const status = product.active === 1 ? 'desactivado' : 'activado';
            await this.showToastMessage(`"${product.name}" ${status} correctamente`);
            await this.loadProducts();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            await this.showToastMessage('Error al cambiar estado', 'danger');
        }
    }

    async showToastMessage(message: string, color: string = 'success') {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color,
            position: 'bottom',
            cssClass: 'custom-toast'
        });
        await toast.present();
    }

    formatPrice(price: number): string {
        return `Q ${price.toFixed(2)}`;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
