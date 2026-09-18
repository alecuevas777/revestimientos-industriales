export const CLIENT_COLUMNS =
  'id,creado_por,nombre,rut,nombre_contacto,cargo_contacto,telefono,email,direccion,ciudad,observaciones,archivado,archivado_en,creado_en,actualizado_en';

export const PROJECT_COLUMNS =
  'id,cliente_id,creado_por,nombre,codigo,direccion,ciudad,ubicacion,contacto_terreno,telefono_terreno,descripcion,observaciones,estado,creado_en,actualizado_en';

export const SURVEY_COLUMNS =
  'id,codigo,proyecto_id,usuario_id,tipo_servicio,estado,alcance,estado_general,motivo_visita,observaciones_generales,conclusion,planta_operativa,restricciones_horario,notas_acceso,maquinaria_retirar,comentarios_faena,datos_servicio,iniciado_en,actualizado_en,finalizado_en';

export const SECTOR_COLUMNS =
  'id,levantamiento_id,nombre,area_aproximada,condicion,criticidad,problemas,otro_problema,usos,otro_uso,nivel_trafico,exposiciones,observaciones,recomendacion,creado_en,actualizado_en';

export const ELEMENT_COLUMNS =
  'id,levantamiento_id,sector_id,tipo_elemento,referencia,material,condicion,nivel_corrosion,problemas,otro_problema,exposiciones,observaciones,criticidad,creado_en,actualizado_en';

export const PHOTO_COLUMNS =
  'id,levantamiento_id,sector_id,elemento_id,ruta_storage,uri_local,categoria,leyenda,creado_en';
