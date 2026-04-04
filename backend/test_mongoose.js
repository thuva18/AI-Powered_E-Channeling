const mongoose = require('mongoose');
const { Schema } = mongoose;

const s = new Schema({ name: String });

s.pre('save', async function(next) {
    if (this.name === 'test') {
        return next();
    }
});

const M = mongoose.model('M', s);

async function run() {
    await mongoose.connect('mongodb://localhost:27017/test_mongoose');
    const doc = new M({ name: 'test' });
    try {
        await doc.save({ validateModifiedOnly: true });
        console.log("Success");
    } catch(err) {
        console.error("ERROR:");
        console.error(err);
    }
    process.exit(0);
}
run();
