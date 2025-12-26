import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, closeOutline } from 'ionicons/icons';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models';

@Component({
    selector: 'app-product-form',
    templateUrl: './product-form.page.html',
    styleUrls: ['./product-form.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButtons,
        IonButton,
        IonBackButton,
        IonIcon,
        IonList,
        IonItem,
        IonLabel,
        IonInput,
        IonSelect,
        IonSelectOption,
        IonToggle
    ]
})
export class ProductFormPage implements OnInit {
    productForm: FormGroup;
    isEditMode = false;
    productId: string | null = null;
    categories: string[] = [];
    customCategory = false;

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private router: Router,
        private route: ActivatedRoute,
        private toastController: ToastController
    ) {
        addIcons({ saveOutline, closeOutline });

        this.productForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            price: [0, [Validators.required, Validators.min(0.01)]],
            category: [''],
            customCategory: [''],
            active: [true]
        });
    }

    async ngOnInit() {
        await this.loadCategories();

        // Verificar si estamos en modo edición
        this.route.queryParams.subscribe(async params => {
            if (params['id']) {
                this.productId = params['id'];
                this.isEditMode = true;
                if (this.productId) {
                    await this.loadProduct(this.productId);
                }
            }
        });
    }

    async loadCategories() {
        this.categories = await this.productService.getCategories();
        // Agregar opciones predefinidas comunes
        const defaultCategories = ['Hamburguesas', 'Bebidas', 'Acompañamientos', 'Postres', 'Extras'];
        defaultCategories.forEach(cat => {
            if (!this.categories.includes(cat)) {
                this.categories.push(cat);
            }
        });
        this.categories.sort();
    }

    async loadProduct(id: string) {
        try {
            const product = await this.productService.getProductById(id);
            if (product) {
                this.productForm.patchValue({
                    name: product.name,
                    price: product.price,
                    category: product.category || '',
                    active: product.active === 1
                });
            }
        } catch (error) {
            console.error('Error al cargar producto:', error);
            await this.showToast('Error al cargar producto', 'danger');
            this.goBack();
        }
    }

    onCategoryChange(event: any) {
        const value = event.detail.value;
        this.customCategory = value === 'custom';
        if (!this.customCategory) {
            this.productForm.patchValue({ customCategory: '' });
        }
    }

    async onSubmit() {
        if (this.productForm.invalid) {
            await this.showToast('Por favor completa todos los campos requeridos', 'warning');
            return;
        }

        try {
            const formValue = this.productForm.value;
            const categoryValue = this.customCategory
                ? formValue.customCategory
                : formValue.category;

            const productData = {
                name: formValue.name.trim(),
                price: parseFloat(formValue.price),
                category: categoryValue || null,
                active: formValue.active ? 1 : 0
            };

            if (this.isEditMode && this.productId) {
                await this.productService.updateProduct(this.productId, productData);
                await this.showToast('Producto actualizado correctamente', 'success');
            } else {
                await this.productService.createProduct(productData);
                await this.showToast('Producto creado correctamente', 'success');
            }

            this.goBack();
        } catch (error) {
            console.error('Error al guardar producto:', error);
            await this.showToast('Error al guardar producto', 'danger');
        }
    }

    async showToast(message: string, color: string = 'success') {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color,
            position: 'bottom',
            cssClass: 'custom-toast'
        });
        await toast.present();
    }

    goBack() {
        this.router.navigate(['/products']);
    }
}
