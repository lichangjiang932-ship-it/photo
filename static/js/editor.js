const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const editorContainer = document.getElementById('editorContainer');

let originalImageData = null;
let originalImage = null;

uploadArea.addEventListener('click', () => imageInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});
imageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            const maxSize = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            originalImageData = ctx.getImageData(0, 0, width, height);
            
            uploadArea.style.display = 'none';
            editorContainer.style.display = 'flex';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

const controls = ['smooth', 'whiten', 'brightness', 'contrast', 'saturation'];
controls.forEach(id => {
    const input = document.getElementById(id);
    const valueSpan = document.getElementById(id + 'Value');
    input.addEventListener('input', () => {
        valueSpan.textContent = input.value;
        applyEffects();
    });
});

function applyEffects() {
    if (!originalImageData) return;
    
    const imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );
    const data = imageData.data;
    
    const brightness = parseInt(document.getElementById('brightness').value);
    const contrast = parseInt(document.getElementById('contrast').value);
    const saturation = parseInt(document.getElementById('saturation').value);
    const whiten = parseInt(document.getElementById('whiten').value);
    const smooth = parseInt(document.getElementById('smooth').value);
    
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        r += brightness;
        g += brightness;
        b += brightness;
        
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
        
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const satFactor = 1 + saturation / 50;
        r = gray + satFactor * (r - gray);
        g = gray + satFactor * (g - gray);
        b = gray + satFactor * (b - gray);
        
        const whitenAmount = whiten / 100;
        r = r + (255 - r) * whitenAmount * 0.3;
        g = g + (255 - g) * whitenAmount * 0.3;
        b = b + (255 - b) * whitenAmount * 0.3;
        
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    if (smooth > 0) {
        applySmooth(smooth / 100);
    }
}

function applySmooth(intensity) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.filter = `blur(${intensity * 3}px)`;
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.globalAlpha = intensity * 0.5;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalAlpha = 1;
}

document.getElementById('resetBtn').addEventListener('click', () => {
    controls.forEach(id => {
        const input = document.getElementById(id);
        const valueSpan = document.getElementById(id + 'Value');
        const defaultVal = id === 'smooth' ? 30 : id === 'whiten' ? 20 : 0;
        input.value = defaultVal;
        valueSpan.textContent = defaultVal;
    });
    applyEffects();
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'beautified_photo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
