// TEST ULTRA-SIMPLE DEL CALENDARIO
console.log('🧪 TESTING CALENDAR LOGIC...\n');

// Simular datos de BD (solo martes abierto)
const savedHours = {
    sunday: { open: false },
    monday: { open: false },
    tuesday: { open: true }, // SOLO ESTE ABIERTO
    wednesday: { open: false },
    thursday: { open: false },
    friday: { open: false },
    saturday: { open: false }
};

// Crear schedule ultra-simple
const loadedSchedule = [
    { day_of_week: 'sunday', day_name: 'Domingo', is_open: Boolean(savedHours.sunday?.open || savedHours.sunday?.is_open), slots: [] },
    { day_of_week: 'monday', day_name: 'Lunes', is_open: Boolean(savedHours.monday?.open || savedHours.monday?.is_open), slots: [] },
    { day_of_week: 'tuesday', day_name: 'Martes', is_open: Boolean(savedHours.tuesday?.open || savedHours.tuesday?.is_open), slots: [] },
    { day_of_week: 'wednesday', day_name: 'Miércoles', is_open: Boolean(savedHours.wednesday?.open || savedHours.wednesday?.is_open), slots: [] },
    { day_of_week: 'thursday', day_name: 'Jueves', is_open: Boolean(savedHours.thursday?.open || savedHours.thursday?.is_open), slots: [] },
    { day_of_week: 'friday', day_name: 'Viernes', is_open: Boolean(savedHours.friday?.open || savedHours.friday?.is_open), slots: [] },
    { day_of_week: 'saturday', day_name: 'Sábado', is_open: Boolean(savedHours.saturday?.open || savedHours.saturday?.is_open), slots: [] }
];

// Añadir horarios solo a días abiertos
loadedSchedule.forEach(day => {
    if (day.is_open) {
        day.slots = [{ start_time: "09:00", end_time: "22:00" }];
    }
});

console.log('📊 SCHEDULE CREADO:');
loadedSchedule.forEach(day => {
    console.log(`  ${day.day_of_week}: ${day.is_open ? '✅ ABIERTO' : '❌ CERRADO'}`);
});

// Simular diferentes fechas
const testDates = [
    { date: '01/10/2025', dayIndex: 3 }, // Miércoles
    { date: '02/10/2025', dayIndex: 4 }, // Jueves
    { date: '07/10/2025', dayIndex: 2 }, // Martes
    { date: '14/10/2025', dayIndex: 2 }, // Martes
    { date: '21/10/2025', dayIndex: 2 }, // Martes
];

console.log('\n🗓️  TEST RENDERIZACIÓN:');
testDates.forEach(({ date, dayIndex }) => {
    const dayData = loadedSchedule[dayIndex];
    const isOpen = dayData.is_open;
    console.log(`  ${date}: ${dayData.day_name} -> ${isOpen ? '✅ ABIERTO' : '❌ CERRADO'}`);
});

console.log('\n🎯 RESULTADO ESPERADO: Solo los días con índice 2 (martes) deberían estar abiertos');
console.log('✅ Si ves "Martes -> ✅ ABIERTO" para todas las fechas de martes, la lógica funciona');
console.log('❌ Si ves otros días abiertos, hay un problema');
