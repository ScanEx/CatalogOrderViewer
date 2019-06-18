using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("scene", Schema="catalog")]
    public class Scene
    {
        public Scene () {}
        [Key, Column("scene_id")]
        public string Id { get; set; }
        [Column("stereo_scene_id")]
        public string StereoSceneId { get; set; }
        [Column("scene_platform_id")]
        public int PlatformId { get; set; }
        [ForeignKey("PlatformId")]
        public virtual Platform Platform { get; set; }
        [Column("scene_identity_value")]
        public int IdentityValue { get; set; }
    }
}