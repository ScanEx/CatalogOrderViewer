using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("scene_archive", Schema="catalog")]
    public class SceneArchive
    {
        public SceneArchive () {}
        [Key, Column("scene_archive_id")]
        public int Id { get; set; }
        [Column("scene_archive_scene_id")]
        public string SceneId { get; set; }
        [ForeignKey("SceneId")]
        public virtual Scene Scene { get; set; }
        [Column("scene_file_path")]
        public string FilePath { get; set; }
        [Column("scene_file_order")]
        public int FileOrder { get; set; }
    }
}