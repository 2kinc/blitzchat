import { app, db, auth } from '../scripts/database.js';
import { UI } from '../scripts/ui.js';

var ui = new UI(db.ref('blitzchat'), '#app');