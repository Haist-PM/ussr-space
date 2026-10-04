import '../app.js';
import {initMuseum} from './museum.js';
initMuseum().catch(error=>{console.error('3D museum:',error);document.documentElement.classList.add('webgl-unavailable');document.querySelectorAll('.view-status').forEach(el=>el.textContent='3D недоступно — исторический рассказ и источники доступны');});
