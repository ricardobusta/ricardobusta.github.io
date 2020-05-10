from pathlib import Path
from string import Template
from pathlib import Path

import os
import frontmatter

file_extension = 'md'
pp = 'privacy-policy'
tac = 'terms-and-conditions'

language = 'en-us'

legal_src_path = Path('.').joinpath('_src', 'legal', 'template')
legal_target_path = Path('.').joinpath('legal')

tac_filename = "{}-{}.{}".format(tac, language, file_extension)
tac_path = legal_target_path.joinpath(tac)
pp_filename = "{}-{}.{}".format(pp, language, file_extension)
pp_path = legal_target_path.joinpath(pp)

contact = "contact@busta.dev"
company_name = "Busta Games"

class LegalGenerator:
    def _generate_legal_pages(self, info: dict):
        values = {
            'contact': contact, 
            'company_name': company_name,
            'app_name': info['title']
        }

        result = None
        with open( legal_src_path.joinpath(tac_filename), 'r' ) as filein:
            src = Template( filein.read() )
            result = src.substitute( values )
            
        tac_path.mkdir(parents=True, exist_ok=True)
        out_file = tac_path.joinpath("{}.{}".format(info['bundle_id'], file_extension))
        
        with open(out_file, "w" ) as fileout:
            print( out_file )
            fileout.write(result)

    def _get_md_files_in_path(self, path: str):
        return list(Path(path).rglob("*.[mM][dD]"))

    def _get_project_information(self, project_path: str):
        with open(project_path) as f:
            metadata, _ = frontmatter.parse(f.read())
            if('bundle_id' in metadata):
                print(metadata['title'])
                return metadata
        
        return None

    def generate_pages(self):
        projects = self._get_md_files_in_path("_projects")
        for project in projects:
            info = self._get_project_information(project)
            if info:
                self._generate_legal_pages(info)