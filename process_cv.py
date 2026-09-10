import re

with open("client/src/views/CVsView.tsx", "r") as f:
    text = f.read()

# Replacements
text = text.replace("EducationItem", "CVItem")
text = text.replace("education", "cvs")
text = text.replace("Education", "CV")
text = text.replace("Educations", "CVs")
text = text.replace("institution", "title")
text = text.replace("degree", "url")
text = text.replace("field", "description")
text = text.replace("startDate", "cvId")
text = text.replace("endDate", "lastUpdated")
text = text.replace("grade", "visible")

# Manual fixes for fields that got mismatched types
text = text.replace('name="visible"\n                render={({ field }) => (\n                  <FormItem>\n                    <FormLabel>Grade</FormLabel>\n                    <FormControl>\n                      <Input {...field} value={field.value || ""} />\n                    </FormControl>\n                  </FormItem>\n                )}\n              />', 'name="visible"\n                render={({ field }) => (\n                  <FormItem>\n                    <FormLabel>Visible</FormLabel>\n                    <FormControl>\n                      <Input {...field} value={field.value || ""} />\n                    </FormControl>\n                  </FormItem>\n                )}\n              />')

with open("client/src/views/CVsView.tsx", "w") as f:
    f.write(text)
