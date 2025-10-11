// سكريبت لتحديث جميع حقول رقم الهاتف في ملف landing-page-view.tsx
const fs = require('fs');
const path = require('path');

const filePath = '/home/sanadi.pro/public_html/client/src/pages/landing-page-view.tsx';

// قراءة الملف
let content = fs.readFileSync(filePath, 'utf8');

// النمط القديم لحقل رقم الهاتف
const oldPhoneFieldPattern = /(\s*{\/\* رقم الهاتف \*\/}\s*<FormField\s+control={form\.control}\s+name="customerPhone"\s+render={\({ field }\) => \(\s*<FormItem>\s*<FormLabel>رقم الهاتف \*<\/FormLabel>\s*<FormControl>\s*<div className="relative">\s*<Phone className="[^"]*" \/>\s*<Input placeholder="[^"]*" className="[^"]*" {\.\.\.field} \/>\s*<\/div>\s*<\/FormControl>\s*<FormMessage \/>\s*<\/FormItem>\s*\)}\s*\/>)/g;

// النمط الجديد
const newPhoneField = `                    {/* رقم الهاتف */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input 
                                placeholder="078X XXX XXXX (11 رقم)" 
                                className={\`pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px] \${phoneValidationError ? 'border-red-500 focus:border-red-500' : ''}\`}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handlePhoneChange(e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                          {phoneValidationError && (
                            <div className="text-red-500 text-xs mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                              ⚠️ {phoneValidationError}
                            </div>
                          )}
                        </FormItem>
                      )}
                    />`;

// استبدال جميع الحقول
content = content.replace(oldPhoneFieldPattern, newPhoneField);

// كتابة الملف المحدث
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ تم تحديث جميع حقول رقم الهاتف بنجاح!');
