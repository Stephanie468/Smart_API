import { Router } from 'express'
import { upload } from '../config/upload.js'
import { uploadFichier } from '../controllers/upload.controller.js'
 
const uploadRoutes = Router()
 
// POST /api/upload
// Reçoit un fichier en multipart/form-data avec le champ "file"
uploadRoutes.post('/', upload.single('file'), uploadFichier)
 
export default uploadRoutes
